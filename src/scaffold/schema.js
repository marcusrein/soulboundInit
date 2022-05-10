const { ascTypeForProtocol, valueTypeForAsc } = require('../codegen/types')
const util = require('../codegen/util')

const abiEvents = abi =>
  util.disambiguateNames({
    values: abi.data.filter(item => item.get('type') === 'event'),
    getName: event => event.get('name'),
    setName: (event, name) => event.set('_alias', name),
  })

const protocolTypeToGraphQL = (protocol, name) => {
  let ascType = ascTypeForProtocol(protocol, name)
  return valueTypeForAsc(ascType)
}

const generateField = ({ name, type, protocolName }) =>
  `${name}: ${protocolTypeToGraphQL(protocolName, type)}! # ${type}`

const generateEventFields = ({ index, input, protocolName }) =>
  input.type == 'tuple'
    ? util
        .unrollTuple({ value: input, path: [input.name || `param${index}`], index })
        .map(({ path, type }) => generateField({ name: path.join('_'), type, protocolName }))
    : [generateField({ name: input.name || `param${index}`, type: input.type, protocolName })]

const generateEventType = (event, protocolName) => `type ${event._alias} @entity {
      id: ID!
      ${event.inputs
        .reduce(
          (acc, input, index) => acc.concat(generateEventFields({ input, index, protocolName })),
          [],
        )
        .join('\n')}
    }`

const generateExampleEntityType = (protocol, events) => {
    if (protocol.hasABIs() && events.length > 0) {
      return `type ExampleEntity @entity {
  id: ID!
  count: BigInt!
  ${events[0].inputs
    .reduce((acc, input, index) => acc.concat(generateEventFields({ input, index, protocolName: protocol.name })), [])
    .slice(0, 2)
    .join('\n')}
}`
    } else {
      return `type ExampleEntity @entity {
  id: ID!
  block: Bytes!
  count: BigInt!
}`
    }
}

const generateBaseMetric = (protocol, events) => {
      return `
              type BaseMetric @entity {
                id: Bytes!
                type: EventType!
                transactionMetadata: TransactionMetadata!
                params: MetricParam!
              }

              type TransactionMetadata @entity {
                id: Bytes! # The TxHash toHex()
                txValue: BigInt!
                timestamp: BigInt!
                blockNumber: BigInt!
                txTo: Bytes!
                txFrom: Bytes!
                txGas: Bytes!
              }

              type InMemoryIncrementStore @entity {
                id: Bytes! # Always 1 =  store this const in the mapping and always just retrieve it - then incrementValue++ when new even
                incrementValue: BigInt!
              }

              type EventType @entity {
                id: Bytes! #ToHex of EventName
                name: String! #The Event Name
              }

              type MetricParam @entity {
                id: Bytes!

                paramName1: String
                paramValue1: String
                paramType1: String

                paramName2: String
                paramValue2: String
                paramType2: String

                paramName3: String
                paramValue3: String
                paramType3: String

                paramName4: String
                paramValue4: String
                paramType4: String

                paramName5: String
                paramValue5: String
                paramType5: String

                paramName6: String
                paramValue6: String
                paramType6: String
              }



              type BadgeType @entity {
                id: Bytes!
                name: String! #The Badge
                ipfs: String! #The
                soul: BigInt!
                linkingParam: String! # This is what ties a baseMetric to a user
                baseMetric: [BadgeMetricLookup!] #The base
              }


              type BadgeMetricLookup @entity {
                id: Bytes! #Combination of BaseMetric ID + BaseID
                badge: BadgeType! #Combination of
                baseMetric: BaseMetric!
              }

              type UserBadge @entity {
                id: Bytes! #BadgeTypeID + UserAddress
                badge: BadgeType! #Combination of
                account: Bytes!
                vanityValue: Bytes! # HOW MUCH THEY HAVE CURATED IN TOTALITY
                vanityName: Bytes! #
              }
            `
}

module.exports = {
  abiEvents,
  protocolTypeToGraphQL,
  generateField,
  generateEventFields,
  generateEventType,
  generateExampleEntityType,
  generateBaseMetric,
}
